import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { htmlToText } from "html-to-text";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    const html = await res.text();

    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.content) {
      throw new Error("Article parse failed");
      }

      const plainText = htmlToText(article.content, {
      wordwrap: false,
      selectors: [
        { selector: "a", options: { ignoreHref: true } },
        { selector: "img", format: "skip" },
        { selector: "h1", options: { uppercase: false } },
      ],
    });

    const cleanedText = plainText
      .replace(new RegExp(`^${article.title}\\s*`, "i"), "")
      .trim()
      .slice(0, 10000); 
    // console.log("Extracted blog content:", cleanedText);
    
    return NextResponse.json({
      title: article.title,
      textContent: cleanedText,
    });
  } catch (err) {
    console.error(" Failed to extract blog content:", err);
    return NextResponse.json({ error: "Failed to extract blog" }, { status: 500 });
  }
}

import React from "react";
import { Link } from "gatsby";

function TableOfContent({ html }) {
  return (
    <div className="table-of-content">
      <h2>Table of Contents</h2>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export default function Blog({ data }) {
  const { frontmatter, html, fields, tableOfContents } = data;
  return (
    <div>
      <h1>
        {(fields && fields.slug_without_date && (
          <Link to={fields.slug_without_date}>{frontmatter.title}</Link>
        )) ||
          `${frontmatter.title}`}
      </h1>
      <h2>{frontmatter.date}</h2>
      {tableOfContents && <TableOfContent html={tableOfContents} />}
      <div
        className="blog-post-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

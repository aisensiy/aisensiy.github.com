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

const Tag = ({ tag }) => (
  <span className="text-xs font-semibold inline-block py-1 px-2 rounded text-rose-700 bg-rose-200 last:mr-0 mr-1">
    {tag}
  </span>
);

const TagList = ({ tags }) => (
  <div className="">
    {tags.map(tag => (
      <Tag key={tag} tag={tag} />
    ))}
  </div>
);

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
      { frontmatter.tags && <TagList tags={frontmatter.tags} /> }
      {tableOfContents && <TableOfContent html={tableOfContents} />}
      <div
        className="prose prose-blog dark:prose-invert max-w-none lg:prose-lg xl:prose-xl"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

import React from "react"
import { Link } from "gatsby"

export default function Blog({ data }) {
  const { frontmatter, html, fields } = data
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tight my-4 text-gray-800">
        {fields && fields.slug_without_date && <Link to={fields.slug_without_date}>{frontmatter.title}</Link> || `${frontmatter.title}`}
      </h1>
      <h2 className="text-gray-600 mb-4">{frontmatter.date}</h2>
      <div
        className="blog-post-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

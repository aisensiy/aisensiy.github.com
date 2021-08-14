import React from "react"
import { graphql } from "gatsby"
import Blog from "../components/Blog"
import Base from "../layouts/base"
import Seo from "../components/seo"

export default function BlogTemplate({ data }) {
  return (
    <Base>
      <Seo title={data.blog.frontmatter.title} article={true} description={data.blog.excerpt} />
      <Blog data={data.blog}/>
    </Base>
  )
}

export const pageQuery = graphql`
  query BlogPostQuery($id: String) {
    blog: markdownRemark(id: { eq: $id }) {
      id
      html
      tableOfContents
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
      }
      excerpt(format: PLAIN, truncate: true, pruneLength: 50)
    }
  }
`

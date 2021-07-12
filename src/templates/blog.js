import React from "react"
import { graphql } from "gatsby"
import Blog from "../components/Blog"

export default function BlogTemplate({ data }) {
  return (
    <Blog data={data.blog}/>
  )
}

export const pageQuery = graphql`
  query BlogPostQuery($id: String) {
    blog: markdownRemark(id: { eq: $id }) {
      id
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
      }
    }
  }
`

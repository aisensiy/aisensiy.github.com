import React from "react"
import { graphql } from "gatsby"
import Blog from "../components/Blog"
import Base from "../layouts/base"
import { Helmet } from 'react-helmet'

export default function BlogTemplate({ data }) {
  return (
    <Base>
      <Helmet title={data.blog.frontmatter.title}>
        <meta name="description" content={data.blog.frontmatter.title} />
        <meta property="og:type" content="article" />
      </Helmet>
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
    }
  }
`

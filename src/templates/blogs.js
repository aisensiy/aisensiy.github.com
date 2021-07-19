import React from "react"
import { graphql, Link } from "gatsby"
import Blog from "../components/Blog"
import Base from "../layouts/base"
import { Helmet } from 'react-helmet'

export default function BlogPage({ data }) {
  const { nodes: blogs, pageInfo } = data.blogs
  const pages = blogs.map(blog => (
    <Blog data={blog} key={blog.id}/>
  ))
  const { pageCount, hasPreviousPage, currentPage } = pageInfo
  const hasNextPage = currentPage < pageCount
  return (
    <Base>
      <Helmet title={data.site.siteMetadata.title} />
      <div>
        {pages}
        <div className="flex justify-center mt-8">
          {hasPreviousPage && <Link to={`/page/${currentPage - 1}`} className="w-32 text-center px-4 py-1 border mx-4 border-gray-800 border-solid">Previous</Link>}
          {hasNextPage && <Link to={`/page/${currentPage + 1}`} className="w-32 text-center px-4 py-1 border mx-4 border-gray-800 border-solid">Next</Link>}
        </div>
      </div>
    </Base>
  )
}

export const pageQuery = graphql`
  query QueryBlogPages($limit: Int! = 5, $skip: Int! = 0) {
    site(siteMetadata: {title: {}}) {
      siteMetadata {
        title
      }
    }
    blogs: allMarkdownRemark(
      sort: { fields: frontmatter___date, order: DESC }
      limit: $limit
      skip: $skip
    ) {
      nodes {
        id
        frontmatter {
          title
          date(formatString: "YYYY MMMM-DD")
        }
        html
        fields {
          slug_without_date
        }
      }
      pageInfo {
        hasPreviousPage
        currentPage
        pageCount
      }
    }
  }
`;

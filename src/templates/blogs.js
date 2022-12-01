import React from "react"
import { graphql, Link } from "gatsby"
import Blog from "../components/Blog"
import Base from "../layouts/base"
import Seo from "../components/seo"

export default function BlogPage({ data }) {
  const { nodes: blogs, pageInfo } = data.blogs
  const pages = blogs.map(blog => (
    <div className="">
      <Blog data={blog} key={blog.id}/>
      <hr className="mt-8" />
    </div>
  ))
  const { pageCount, hasPreviousPage, currentPage } = pageInfo
  const hasNextPage = currentPage < pageCount
  return (
    <Base>
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

export const Head = () => (<Seo />)

export const pageQuery = graphql`
  query QueryBlogPages($limit: Int! = 5, $skip: Int! = 0) {
    site(siteMetadata: {title: {}}) {
      siteMetadata {
        title
      }
    }
    blogs: allMarkdownRemark(
      sort: {frontmatter: {date: DESC}}
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

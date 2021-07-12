import React from "react";
import { graphql, Link } from "gatsby";
import Blog from "../components/Blog";

export default function BlogPage({ data }) {
  const { nodes: blogs, pageInfo } = data.blogs
  const pages = blogs.map(blog => (
    <Blog data={blog} key={blog.id}/>
  ))
  const { pageCount, hasPreviousPage, currentPage } = pageInfo
  const hasNextPage = currentPage < pageCount
  return (
    <div>
      {pages}
      <div>
        {hasPreviousPage && <Link to={`/page/${currentPage - 1}`}>Previous</Link>}
        {hasNextPage && <Link to={`/page/${currentPage + 1}`}>Next</Link>}
      </div>
    </div>
  )
}

export const pageQuery = graphql`
  query QueryBlogPages($limit: Int! = 5, $skip: Int! = 0) {
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

import { graphql, Link } from "gatsby";
import React from "react";

export default function Archive({ data }) {
  const groupByYearResult = groupByYear(data.allMarkdownRemark.nodes);

  return (
    <div>
      <h1>Archive</h1>
      {groupByYearResult.map(({ key, value }) => (
        <div key={key}>
          <h2>{key}</h2>
          <YearItems blogs={value} />
        </div>
      ))}
    </div>
  );
}

function YearItems({ blogs }) {
  return (
    <ul>
      {blogs.map((blog) => (
        <li key={blog.id}>
          <Link to={blog.fields.slug}>
            {blog.frontmatter.date} - {blog.frontmatter.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export const query = graphql`
  query QueryBlogTitles {
    allMarkdownRemark(sort: { fields: frontmatter___date, order: DESC }) {
      nodes {
        id
        frontmatter {
          title
          date(formatString: "YYYY MMMM-DD")
        }
        fields {
          slug
        }
      }
    }
  }
`;

function groupByYear(blogs) {
  const result = {};
  for (let blog of blogs) {
    if (!result[blog.frontmatter.year]) {
      result[blog.frontmatter.year] = [];
    }
    result[blog.frontmatter.year].push(blog);
  }
  const arrayResult = Object.keys(result).map((year) => ({
    key: year,
    value: result[year],
  }));
  arrayResult
    .sort((a, b) => {
      return a.key - b.key;
    })
    .reverse();
  return arrayResult;
}

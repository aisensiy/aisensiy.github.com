import { graphql, Link } from "gatsby";
import React from "react";
import Base from "../layouts/base";
import Seo from "../components/seo";

export default function Archive({ data }) {
  const groupByYearResult = groupByYear(data.allMarkdownRemark.nodes);

  return (
    <Base>
      <div>
        <h1>Archive</h1>
        {groupByYearResult.map(({ key, value }) => (
          <div key={key}>
            <h2 className="text-2xl font-bold tracking-tight my-4">{key}</h2>
            <YearItems blogs={value} />
          </div>
        ))}
      </div>
    </Base>
  );
}

export const Head = () => (<Seo title="Archive" />);

function YearItems({ blogs }) {
  return (
    <ul className="space-y-1">
      {blogs.map((blog) => (
        <li className="list-disc list-inside" key={blog.id}>
          <Link to={blog.fields.slug_without_date}>
            {blog.frontmatter.title} - {blog.frontmatter.date}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export const query = graphql`
  query QueryBlogTitles {
    allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
      nodes {
        id
        frontmatter {
          title
          date(formatString: "MMMM-DD")
          year: date(formatString: "YYYY")
        }
        fields {
          slug_without_date
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

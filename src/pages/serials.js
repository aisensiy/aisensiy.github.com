import { graphql, Link } from "gatsby";
import React from "react";
import Base from "../layouts/base";
import Seo from "../components/seo";

export default function Archive({ data }) {
  const groupByCategoryResult = groupByCategory(data.allMarkdownRemark.nodes);

  return (
    <Base>
      <Seo title="Serials" />
      <div>
        <h1>Serials</h1>
        {groupByCategoryResult.map(({ key, value }) => (
          <div key={key}>
            <h2 className="text-2xl font-bold tracking-tight my-4">{key}</h2>
            <YearItems blogs={value} />
          </div>
        ))}
      </div>
    </Base>
  );
}

function YearItems({ blogs }) {
  return (
    <ul className="space-y-1">
      {blogs.map((blog) => (
        <li className="list-disc list-inside" key={blog.id}>
          <Link to={blog.fields.slug_without_date}>
            {blog.frontmatter.date} - {blog.frontmatter.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export const query = graphql`
  query QueryBlogTitlesAndCategories {
    allMarkdownRemark(sort: { fields: frontmatter___date, order: DESC }) {
      nodes {
        id
        frontmatter {
          title
          categories
          date(formatString: "MMMM-DD")
          timestamp: date(formatString: "YYYY-MM-DD")
          year: date(formatString: "YYYY")
        }
        fields {
          slug_without_date
        }
      }
    }
  }
`;

function groupByCategory(blogs) {
  console.log(blogs);
  const result = {};
  for (let blog of blogs) {
    if (!blog.frontmatter.categories) continue;
    for (let category of blog.frontmatter.categories) {
      if (!result[category]) result[category] = [];
      result[category].push(blog);
    }
  }
  let listResult = Object.keys(result).map((key) => ({ key, value: result[key], weight: result[key].length ? result[key][0].frontmatter.timestamp : 0 }));
  listResult
    .sort((a, b) => {
      return a.weight - b.weight;
    });
  return listResult;
}

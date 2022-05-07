import { graphql, Link } from "gatsby";
import React from "react";
import Base from "../layouts/base";
import Seo from "../components/seo";

export default function Archive({ data }) {
  const groupByTagResult = groupByTag(data.allMarkdownRemark.nodes);

  return (
    <Base>
      <Seo title="Tags" />
      <div>
        <h1>Tags</h1>
        {groupByTagResult.map(({ key, value }) => (
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
            {blog.frontmatter.title} - {blog.frontmatter.date}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export const query = graphql`
  query QueryBlogTitlesAndTags {
    allMarkdownRemark(sort: { fields: frontmatter___date, order: DESC }) {
      nodes {
        id
        frontmatter {
          title
          tags
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

function groupByTag(blogs) {
  const result = {};
  for (let blog of blogs) {
    if (!blog.frontmatter.tags) continue;
    for (let tag of blog.frontmatter.tags) {
      if (!result[tag]) result[tag] = [];
      result[tag].push(blog);
    }
  }
  // map to list
  let listResult = Object.keys(result).filter( key => result[key].length > 1).map((key) => ({ key, value: result[key], weight: result[key].length }));
  listResult
    .sort((a, b) => {
      return a.weight - b.weight;
    })
    .reverse();
  return listResult;
}

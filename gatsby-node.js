const { createFilePath } = require("gatsby-source-filesystem")

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions
  if (node.internal.type === `MarkdownRemark`) {
    const filename = createFilePath({ node, getNode })
    // get the date and title from the file name
    const [, date, title] = filename.match(
      /^\/([\d]{4}-[\d]{2}-[\d]{2})-{1}(.+)\/$/
    );

    // create a new slug concatenating everything
    createNodeField({ node, name: `slug`, value: `/${date.replace(/\-/g, "/")}/${title}/` })
    createNodeField({ node, name: `slug_without_date`, value: `/${title}` })
  }
}

const path = require("path");
exports.createPages = async ({ graphql, actions, reporter }) => {
  // Destructure the createPage function from the actions object
  const { createPage } = actions
  const result = await graphql(`
    {
      allMarkdownRemark {
        nodes {
          id
          fields {
            slug
            slug_without_date
          }
        }
        pageInfo {
          totalCount
        }
      }
    }
  `)
  if (result.errors) {
    reporter.panicOnBuild('🚨  ERROR: Loading "createPages" query');
  }
  // Create blog post pages.
  const posts = result.data.allMarkdownRemark.nodes;
  // you'll call `createPage` for each result
  posts.forEach((node, index) => {
    createPage({
      // This is the slug you created before
      // (or `node.frontmatter.slug`)
      path: node.fields.slug,
      // This component will wrap our markdown content
      component: path.resolve(`./src/templates/blog.js`),
      // You can use the values in this context in
      // our page layout component
      context: { id: node.id },
    })

    createPage({
      // This is the slug you created before
      // (or `node.frontmatter.slug`)
      path: node.fields.slug_without_date,
      // This component will wrap our markdown content
      component: path.resolve(`./src/templates/blog.js`),
      // You can use the values in this context in
      // our page layout component
      context: { id: node.id },
    });
  })
  const { totalCount } = result.data.allMarkdownRemark.pageInfo
  const perPage = 5
  const totalPage = totalCount % perPage == 0 ? parseInt(totalCount / perPage) : (parseInt(totalCount / perPage) + 1)
  for (let i = 1; i <= totalPage; i++) {
    let skip = (i - 1) * 5
    console.log(`create page/${i}`)
    createPage({
      path: `/page/${i}`,
      component: path.resolve(`./src/templates/blogs.js`),
      context: {
        limit: perPage,
        skip: skip,
      }
    })
  }
}

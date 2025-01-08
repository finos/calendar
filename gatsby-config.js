/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-config/
 */

/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  siteMetadata: {
    title: `FINOS Event Calendar`,
  },
  headers: [
    {
      source: '*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "frame-ancestors 'self' https://finos.org", // Allow embedding from 'finos.org' and same origin
        },
      ],
    },
  ],
}

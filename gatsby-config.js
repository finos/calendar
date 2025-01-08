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
          key: 'x-frame-options',
          value: 'SAMEORIGIN', // Allow embedding only from the same origin
        },
        {
          key: 'content-security-policy',
          value: "frame-ancestors 'self' https://finos.org", // Allow embedding from 'finos.org' and same origin
        },
      ],
    },
  ],
}

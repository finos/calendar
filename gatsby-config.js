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
  plugins: [
    {
      resolve: 'gatsby-plugin-netlify',
      options: {
        headers: {
          '/*': [
            'X-Frame-Options: SAMEORIGIN',
            'Content-Security-Policy: frame-ancestors \'self\' https://finos.org',
          ],
        },
      },
    },
  ],
};

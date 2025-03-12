import React from 'react';
import { graphql } from 'gatsby';

import '../utils/encoding-polyfill';
import '../styles/App.css';
import Calendar from '../components/Calendar';
import Header from '../components/Header';

function App() {
  return (
    <div className="App main">
      <header className="header-main">
        <Header />
      </header>
      <main className="body-main">
        <Calendar />
      </main>
    </div>
  );
}

export default App;

export const Head = ({ data }) => {
  const title = data.site.siteMetadata.title;
  return <title>{title}</title>;
};

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`;

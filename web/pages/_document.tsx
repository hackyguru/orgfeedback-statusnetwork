import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&display=swap"
          rel="stylesheet"
        />
        <title>Feedblock</title>
        <meta name="description" content="Optimize your team's perfomance with decentralised feedback exchange" />

        <meta property="og:url" content="https://feedblock.hackyguru.com" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Feedblock" />
        <meta property="og:description" content="Optimize your team's perfomance with decentralised feedback exchange" />
        <meta property="og:image" content="https://opengraph.b-cdn.net/production/images/c9d9de7f-79fc-4af0-afc1-be1e85e4fd1e.png?token=juP1_dR1eJFIIFjhfRe_EmSI7jf9KL6IBalBP3sEKvE&height=675&width=1200&expires=33290354369" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="feedblock.hackyguru.com" />
        <meta property="twitter:url" content="https://feedblock.hackyguru.com" />
        <meta name="twitter:title" content="Feedblock" />
        <meta name="twitter:description" content="Optimize your team's perfomance with decentralised feedback exchange" />
        <meta name="twitter:image" content="https://opengraph.b-cdn.net/production/images/c9d9de7f-79fc-4af0-afc1-be1e85e4fd1e.png?token=juP1_dR1eJFIIFjhfRe_EmSI7jf9KL6IBalBP3sEKvE&height=675&width=1200&expires=33290354369" />

      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

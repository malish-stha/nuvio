import React from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function NextPage() {
  return (
    <React.Fragment>
      <Head>
        <title>Nuvio</title>
      </Head>
      <div>
        <p>
          Nuvio -<Link href="/">Go to home page</Link>
        </p>
      </div>
    </React.Fragment>
  )
}

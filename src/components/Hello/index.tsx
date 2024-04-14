import React, { useState } from "react"

export type HelloProps = {};

export const Hello = () => {
  const [count, setCount] = useState(0)
  return (
    <div>
      <h1>Hello World</h1>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  )
}
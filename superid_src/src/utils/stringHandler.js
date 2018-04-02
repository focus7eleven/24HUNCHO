const StringHandler = {
  splitAndJoin: (str, split) => str
    .split(split)
    .reduce((a, b) => {
      if (a.length != 0) a.push(split)
      a.push(b)
      return a
    }, [])
}

export default StringHandler

import React from 'react'
import { Map } from 'immutable'
import AnnouncementChat from './AnnouncementChat'

const AnnouncementChatTest = React.createClass({
  render(){
    let affair = Map({
      id: 8369
    })
    return (
      <AnnouncementChat
        affair={affair}
        isOfficial
      />
    )
  }
})

export default AnnouncementChatTest

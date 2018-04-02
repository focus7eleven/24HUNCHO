import {
  fromJS,
  Map,
  List,
} from 'immutable'
import {
  ALLIANCE_CREATE,
  ALLIANCE_VERIFICATION_SUBMITTED,
  FETCH_ALLIANCE_LIST,
  GET_SINGLE_TREE,
} from '../actions/alliance'
import {
  Alliance
} from '../models/Alliance'

const initialState = fromJS({
  allianceMap: Map(),
  allianceTree: Map(),
  myAllianceList: Map(),
})

export default (state = initialState, action) => {
  let allianceId, allianceList, newAlliance, tree, allianceTree

  switch (action.type) {
    case ALLIANCE_CREATE[1]:
      newAlliance = action.response.data
      return state.setIn(['myAllianceList', newAlliance.id], new Alliance({
        id: newAlliance.id,
        ownerRoleId: newAlliance.ownerRoleId,
        code: newAlliance.code,
        name: newAlliance.name,
        verified: newAlliance.applyCertificateState,
      }))
    case FETCH_ALLIANCE_LIST[1]:
      if (action.response.code !== 0) return state

      allianceList = action.response.data
      return state.update('myAllianceList', (myAllianceList) => {
        List(allianceList).forEach((alliance) => {
          myAllianceList = myAllianceList.set(alliance.id, new Alliance({
            id: alliance.id,
            ownerRoleId: alliance.ownerRoleId,
            code: alliance.code,
            name: alliance.name,
            verified: alliance.applyCertificateState,
          }))
        })
        return myAllianceList
      })
    case ALLIANCE_VERIFICATION_SUBMITTED:
      ({
        allianceId
      } = action.payload)
      return state.updateIn(['allianceMap', allianceId], (v) => v.set('verified', 2))
    case GET_SINGLE_TREE:
      allianceId = action.payload.allianceId
      tree = action.payload.data
      allianceTree = state.get('allianceTree')
      if (allianceTree.find((v, k) => {return k == allianceId})){
        state = state.mergeIn(['allianceTree', allianceId], tree)
      }
      else {
        state = state.update('allianceTree', (v) => v.set(allianceId, tree))
      }
      return state

    default:
      return state
  }
}

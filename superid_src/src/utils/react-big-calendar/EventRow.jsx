import React from "react";
import EventRowMixin from "./EventRowMixin";


let EventRow = React.createClass({

    displayName: 'EventRow',

    propTypes: {
        segments: React.PropTypes.array
    },

    mixins: [EventRowMixin],

    render(){
        let {segments} = this.props;//从eventLevels里拿的levels

        let lastEnd = 1;

        return (
            <div className='rbc-row' style={{height: "80%"}}>
                {
                    segments.reduce((row, { events, left, right, span }, li) => {
                        let key = '_lvl_' + li;
                        let gap = left - lastEnd;

                        let content = this.renderEvent(events)

                        if (gap)
                            row.push(this.renderSpan(gap, key + '_gap'))

                        row.push(
                            this.renderSpan(span, key, content)
                        )

                        lastEnd = (right + 1);
                        return row;
                    }, [])
                }
            </div>
        )
    }
});

export default EventRow

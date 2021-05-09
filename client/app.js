const conn = new WebSocket('ws://localhost:8000') ;

let centers ;

const handleResponse = response => {
    // function to handle responses from websocket
    const {operationType, operationOn, data} = JSON.parse(response) ;


    switch(operationType) {
        case 'initialize' :
            centers = data ;

            console.log(Object.keys(centers).length) ;
            break ;
        case 'add' :
            switch(operationOn) {
                case 'center' :
                    centers[data.center_id] = data.center ;

                    console.log(`${data.center.name} added`) ;
                    break ;
                case 'session' :
                    centers[data.center_id].sessions.push(data.session) ;

                    console.log(`new session ${data.session.session_id} added at ${centers[data.center_id].name}`) ;
                    break ;
            }
            break ;
        case 'update' :
            centers[data.center_id].sessions.some((session, index) => {
                if (data.session_id === session.session_id) {
                    centers[data.center_id].sessions[index].available_capacity = data.available_capacity ;
                    return true ;
                }
            })

            console.log(`available capacity of session : ${data.session_id} at ${centers[data.center_id].name} changed to ${data.available_capacity}`) ;
            break ;
        case 'delete' :
            centers[data.center_id].sessions.some((session, index) => {
                if (data.session_id === session.session_id) {
                    centers[data.center_id].sessions.splice(index, 1) ;
                    return true ;
                }
            })

            console.log(`session ${data.session_id} at ${centers[data.center_id].name} deleted`)
            break ;
        default:
            console.log('boom') ;
            break ;
    }
}

conn.onmessage = ({data}) => handleResponse(data) ;

conn.onerror = error => console.log(error) ;




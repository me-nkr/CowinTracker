const got = require('got') ;
const ws = require('ws') ;
const clients = new Set() ;
const centers = {} ;

const wss = new ws.Server({port : 8000}) ;

wss.on('connection', socket => {
    clients.add(socket)
    console.log('client joined') ;
    socket.send(JSON.stringify({
        operationType: 'initialize',
        data: centers
    })) ;
})

const districts =[
    { id: 295, name: 'Kasaragod' },
    { id: 296, name: 'Thiruvananthapuram' },
    { id: 297, name: 'Kannur' },
    { id: 298, name: 'Kollam' },
    { id: 299, name: 'Wayanad' },
    { id: 300, name: 'Pathanamthitta' },
    { id: 301, name: 'Alappuzha' },
    { id: 302, name: 'Malappuram' },
    { id: 303, name: 'Thrissur' },
    { id: 304, name: 'Kottayam' },
    { id: 305, name: 'Kozhikode' },
    { id: 306, name: 'Idukki' },
    { id: 307, name: 'Ernakulam' },
    { id: 308, name: 'Palakkad' }
] ;

const date = () => new Date().toLocaleString('en-IN').split(',')[0].split('/').join('-') ;

const sendData = (operationType, operationOn, data) => {
    for (let client of clients) client.send(
        JSON.stringify({
            operationType: operationType,
            operationOn: operationOn,
            data: data
        })
        ) ;
}

const deleteSession = centersObj => {
    Object.keys(centersObj).forEach(center_id => {
        centers[center_id].sessions.forEach((session, index) => {
            const bool = new Date(new Date((([date, month, year]) => `${month}/${date}/${year}`)(session.date.split('-'))).setHours(13)) < new Date() ;

            if (new Date(new Date((([date, month, year]) => `${month}/${date}/${year}`)(session.date.split('-'))).setHours(13)) < new Date()) {
                centers[center_id].sessions.splice(index, 1) ;

                // delete
                sendData('delete', 'session', {
                    center_id: center_id,
                    session_id: session.session_id
                })
            }
        })
    })
}

const updateSessions = (centersObj, data) => {
    data.sessions.forEach(newSession => {
        if (!centersObj[`k${data.center_id}`].sessions.some((session, index) => {
            if (session.session_id === newSession.session_id) {
                if (session.available_capacity !== newSession.available_capacity) {

                    centers[`k${data.center_id}`].sessions[index].available_capacity = newSession.available_capacity ;

                    // update
                    sendData('update', 'session', {
                        center_id: `k${data.center_id}`,
                        session_id: newSession.session_id,
                        available_capacity: newSession.available_capacity
                    }) ;
                }
                return true ;
            }
        })) {
            
            centers[`k${data.center_id}`].sessions.push(newSession) ;

            // add
            sendData('add', 'session', {
                center_id: `k${data.center_id}`,
                session: newSession
            })
        }
    })
}


const updateData = (centersObj, data) => {

    if (!centersObj.hasOwnProperty(`k${data.center_id}`)) {

        centers[`k${data.center_id}`] = (({ center_id, ...o }) => o)(data) ;

        // add
        sendData('add', 'center', {
            center_id: `k${data.center_id}`,
            center: centers[`k${data.center_id}`]
        }) ;
    }
    else updateSessions(centersObj, data) ;
}

const handleResponse = result => {
    result.centers.forEach(center => {
        const data = (({
            center_id,
            name,
            address,
            district_name,
            state_name,
            pincode,
            fee_type,
            sessions
        }) => {
            return {
                center_id,
                name,
                address,
                district_name,
                state_name,
                pincode,
                fee_type,
                sessions
            }
        })(center)  ;
        data.sessions = data.sessions.map(session => {
            return {
                session_id: session.session_id,
                date: session.date,
                available_capacity: session.available_capacity,
                min_age_limit: session.min_age_limit,
                vaccine: session.vaccine
            } ;
        })
        deleteSession(centers) ;
        updateData(centers, data) ;
    })
}

const apiCall = (districtId, date) => {
    got(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${districtId}&date=${date}`)
    .then(response => JSON.parse(response.body))
    .then(result => handleResponse(result))
    .catch(error => console.log(error.message))
} ;

districts.forEach((district, index) => {
    setTimeout(() => {
        apiCall(district.id, date()) ;

        setInterval(() => {
            apiCall(district.id, date()) ;
      }, districts.length * 3000);

    }, index * 3000);

  });

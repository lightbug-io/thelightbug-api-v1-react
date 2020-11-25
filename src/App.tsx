import React, {Component} from 'react';
import './App.css';
import {DeviceApi, UserApi} from "./lb-api";
import {Configuration} from "./lb-api/configuration";


export class App extends Component {
    constructor(props:any) {
        super(props);
        this.state = { items: [] };
    }

    async getDevicesAndPoints() {
        try {
            const config = new Configuration();
            const userApi = new UserApi(config);
            const deviceApi = new DeviceApi(config);
            try {
                let token = await userApi.userLogin({username: "USERNAME", password: "PASSWORD"});
                config.accessToken = token.id;
                config.userId = `${token.userId}`;

            } catch {
                console.error('Login Failed')
                alert('Login Fail');
                return;
            }

            let allDevices = await userApi.userPrototypeGetDevices(config.userId,
                JSON.stringify({where: {lastConnection : {gt: +new Date() - 7 * 24 * 3600 * 1000} }})
            );

            const items: any[] = [];
            for (const device of allDevices) {
                if (!device.id) continue; // prevent error on next line
                let points = await deviceApi.devicePrototypeGetPoints(device.id,
                    JSON.stringify({// filter needs to be a JSON encoded string
                        //Optional query filters
                        where: {
                            timestamp: {between: [+new Date() - 7 * 24 * 3600 * 1000, new Date()]},
                            //alternatively using greater than operator (gt):
                            //timestamp: {gt: +new Date() - 7 * 24 * 3600 * 1000},
                            locationType: {neq: 'invalid'}
                        },
                        order: 'timestamp DESC', // order by newest points first
                        limit: 5 //only get the 5 newest points
                    }));

                const pointsItems: any[] = [];
                points.forEach(point => {
                    pointsItems.push(
                        <div key={point.id} className="point">
                            <b>{point.timestamp}</b> - {point.address} ({point.location?.lat}, {point.location?.lng})
                        </div>
                    )
                });

                items.push(
                    <div key={device.id} className="device-info">
                        <h3>Device {device.name}</h3>
                        {pointsItems}
                    </div>
                )
            }

            this.setState({items});
        } catch (e) {
            console.error("Failed to get data", e);
        }
    }

    componentDidMount() {
        this.getDevicesAndPoints().then();
    }


    render() {
        return (
            <div className="App">
                <h1>LightBug API Example</h1>
                {(this.state as any).items?.length ? (this.state as any).items : 'Loading...'}
            </div>
        );
    }

}

export default App;

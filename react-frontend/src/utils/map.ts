import { RouteExistsError } from './../errors/route-exists-error';
export class Route {
    public currentMarker: google.maps.Marker
    public endMarker: google.maps.Marker
    private directionsRenderer: google.maps.DirectionsRenderer

    constructor(options: {
        currentMarkerOptions: google.maps.ReadonlyMarkerOptions,
        endMarkerOptions: google.maps.ReadonlyMarkerOptions,
    }) {
        const { 
            currentMarkerOptions, 
            endMarkerOptions 
        } = options
        this.currentMarker = new google.maps.Marker(currentMarkerOptions)
        this.endMarker = new google.maps.Marker(endMarkerOptions)

        const strokeColor = (this.currentMarker.getIcon() as google.maps.ReadonlySymbol).strokeColor
        this.directionsRenderer = new google.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: {
                strokeColor,
                strokeOpacity: 0.5,
                strokeWeight: 5
            }
        })
        this.directionsRenderer.setMap(
            this.currentMarker.getMap() as google.maps.Map
        )
        this.calculateRoute()
    }

    private calculateRoute() {
        const currentPosition = this.currentMarker.getPosition() as google.maps.LatLng
        const endPosition = this.endMarker.getPosition() as google.maps.LatLng
        new google.maps.DirectionsService().route({
            origin: currentPosition,
            destination: endPosition,
            travelMode: google.maps.TravelMode.DRIVING,
        }, (result, status) => {
            if(status === 'OK') {
                this.directionsRenderer.setDirections(result)
                return
            }
            throw new Error(status)
        })
    }

    delete() {
        this.currentMarker.setMap(null)
        this.endMarker.setMap(null)
        this.directionsRenderer.setMap(null)
    }
}

export class Map {
    public map: google.maps.Map
    private routes: {[id: string]: Route} = {}

    constructor(element: Element, options: google.maps.MapOptions) {
        this.map = new google.maps.Map(element, options)
    }

    moveCurrentPosition(id: string, position: google.maps.LatLngLiteral) {
        this.routes[id].currentMarker.setPosition(position);
    }

    removeRoute(id: string){
        const route = this.routes[id]
        route.delete()
        delete this.routes[id]
    }

    addRoute(
        id: string,
        routeOptions: {
            currentMarkerOptions: google.maps.ReadonlyMarkerOptions,
            endMarkerOptions: google.maps.ReadonlyMarkerOptions,
        }
    ){
        if(id in this.routes) {
            throw new RouteExistsError()
        }
        const { currentMarkerOptions, endMarkerOptions } = routeOptions
        this.routes[id] = new Route({
            currentMarkerOptions: {...currentMarkerOptions, map: this.map },
            endMarkerOptions:{...endMarkerOptions, map: this.map }
        })
        this.fitBounds()
    }

    private fitBounds() {
        const bounds = new google.maps.LatLngBounds()

        Object.keys(this.routes).forEach((id: string) => {
            const route = this.routes[id]
            bounds.extend(route.currentMarker.getPosition() as any)
            bounds.extend(route.endMarker.getPosition() as any)
        })
        this.map.fitBounds(bounds)
    }
}

export const makeCarIcon = (color: string) => ({
    path: 'M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z',
    strokeColor: color,
    fillColor: color,
    strokeOpacity: 1,
    strokeWeight: 1,
    fillOpacity: 1,
    anchor: new google.maps.Point(46, 70)
})

export const makeMarkerIcon = (color: string) => ({
    path: 'M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z',
    strokeColor: color,
    fillColor: color,
    strokeOpacity: 1,
    strokeWeight: 1,
    fillOpacity: 1,
    anchor: new google.maps.Point(26, 20)
})
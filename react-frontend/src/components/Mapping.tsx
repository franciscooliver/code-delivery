import { Button, Grid, makeStyles, MenuItem, Select } from "@material-ui/core";
import { FormEvent, FunctionComponent, useCallback, useEffect, useRef, useState } from "react";
import { Loader } from "google-maps";
import { Route } from "../utils/models";
import { getCurrentPosition } from "../utils/geolocation";
import { makeCarIcon, makeMarkerIcon, Map } from "../utils/map";
import { sample, shuffle } from "lodash";
import { useSnackbar } from "notistack";
import { RouteExistsError } from "../errors/route-exists-error";
import { Navbar } from "./Navbar";
import io, { Socket } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL as string

const googleMapLoader = new Loader(process.env.REACT_APP_GOOGLE_API_KEY)

const colors = [
    '#d32f2f',
    '#ab47bc',
    '#388e3c',
    '#f57c00',
    '#42a5f5',
    '#c2185b',
    '#ffb74d',
    '#3e27223',
    '#09a9f4',
    '#827717'
]

const useStyles = makeStyles({
    root: {
        width: '100%',
        height: '100%'
    },
    rootLeftItem: {
        padding: '1rem'
    },
    form: {
        margin: '16px',
    },
    btnSubmitWrapper: {
        textAlign: 'center',
        marginTop: '.5rem'
    },
    map: {
        width: '100%',
        height: '100%'
    }

})

export const Mapping: FunctionComponent = (props) => {
    const classes = useStyles()
    const [routes, setRoutes] = useState<Route[]>([])
    const [routeIdselected, setRouteIdselected] = useState<string>('')
    const mapRef = useRef<Map>()
    const socketIORef = useRef<Socket>();
    const { enqueueSnackbar } = useSnackbar()

    const finishRoute = useCallback((route: Route) => {
        enqueueSnackbar(`${route.title} finalizou!`, {
            variant: 'success'
        })
        mapRef.current?.removeRoute(route._id)
    }, [enqueueSnackbar])

    useEffect(() => {
        if(!socketIORef.current?.connected){
            socketIORef.current = io(API_URL)
            socketIORef.current.on('connect', () => console.log('Conectou'))
        }
        const handler = (data: {
            routeId: string,
            position: [number, number],
            finished: boolean
        }) => {
            mapRef.current?.moveCurrentPosition(data.routeId, {
                lat: data.position[0],
                lng: data.position[1]
            })
            const route = routes.find(route => route._id === data.routeId) as Route
            if(data.finished) {
                finishRoute(route)
            }
        }
        socketIORef.current?.on('new-position', handler)
        return () => {
            socketIORef.current?.off('new-position', handler)
        }
    }, [finishRoute, routes])
    
    useEffect(() => {
        fetch(`${API_URL}/routes`)
        .then(data => data.json())
        .then(data => setRoutes(data))
    }, [])

    useEffect(() => {
        (async () => {
            const [, position] = await Promise.all([
                googleMapLoader.load(),
                getCurrentPosition({enableHighAccuracy: true})
            ])
            const divMap = document.getElementById('map') as HTMLElement
            mapRef.current = new Map(divMap, {
                zoom: 15,
                center: position
            })  
        })()
    }, [])

    const startRoute = useCallback((event: FormEvent) => {
        event.preventDefault()
        const route = routes.find(route => route._id === routeIdselected)
        const color = sample(shuffle(colors)) as string
        try {
            mapRef.current?.addRoute(routeIdselected, {
                currentMarkerOptions: {
                    position: route?.startPosition,
                    icon: makeCarIcon(color)
                },
                endMarkerOptions: {
                    position: route?.endPosition,
                    icon: makeMarkerIcon(color)
                }
            })
            socketIORef.current?.emit('new-direction', {
                routeId: routeIdselected
            })
        } catch (error) {
            if(error instanceof RouteExistsError) {
                enqueueSnackbar(`${route?.title} já adicionado, aguardar finalização!`, {
                    variant: 'error'
                })
                return
            }
            throw error
        }   
    }, [routeIdselected, routes, enqueueSnackbar])

    return (
        <Grid container className={classes.root}>
            <Grid item xs={12} sm={3}>
                <Navbar /> 
                <form onSubmit={startRoute} className={classes.form}>
                    <Select 
                        fullWidth
                        displayEmpty
                        value={routeIdselected}
                        onChange={(event) => setRouteIdselected(event.target.value + "")}> 
                        <MenuItem value="">
                            <em>Selecione uma corrida</em>
                        </MenuItem>
                        {routes.map((route, key) => (
                            <MenuItem key={key} value={route._id}>
                                {route.title}
                            </MenuItem>
                        ))}
                    </Select>
                    <Button 
                        type="submit" 
                        color="primary" 
                        variant="contained"
                        className={classes.btnSubmitWrapper}
                    >
                        Iniciar uma corrida
                    </Button>
                </form>
            </Grid>
            <Grid item xs={12} sm={9}>
                <div id="map" className={classes.map}></div>
            </Grid>
        </Grid>
    );
};
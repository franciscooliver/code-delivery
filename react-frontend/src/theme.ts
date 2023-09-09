import {createTheme, ThemeOptions } from "@material-ui/core";

const pallete: ThemeOptions = {
    palette: {
        type: 'dark',
        primary: {
            main: '#FFCD00',
            contrastText: '#242526',
        },
        background: {
            default: '#242526',
        },
    }
};

const theme = createTheme(pallete)

export default theme
import { CssBaseline, MuiThemeProvider } from '@material-ui/core';
import { SnackbarProvider } from 'notistack';
import './App.css';
import { Mapping } from './components/Mapping';
import theme from './theme';

function App() {
  return (
    <MuiThemeProvider theme={theme}> 
      <SnackbarProvider maxSnack={3} autoHideDuration={5000}>
        <CssBaseline/>
        <Mapping/>
      </SnackbarProvider>
    </MuiThemeProvider>
  );
}

export default App;

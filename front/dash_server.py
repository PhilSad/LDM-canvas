import dash
import dash_html_components as html
from dash_canvas import DashCanvas

app = dash.Dash(__name__)


filename = "https://www.researchgate.net/profile/Cataldo-Guaragnella/publication/235406965/figure/fig1/AS:393405046771720@1470806480985/Original-image-256x256-pixels.png"
canvas_width = 1500


app.layout = html.Div([
    DashCanvas(id='canvaas_image',
               tool='line',
               lineWidth=5,
               lineColor='red',
               filename=filename,
               width=canvas_width)
    ])


if __name__ == '__main__':
    app.run_server(debug=True)
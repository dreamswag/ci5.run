from flask import Flask, render_template, send_from_directory, request, Response

app = Flask(__name__)

SCRIPT_DIR = 'scripts'
SCRIPT_MAP = {
    'install': 'bootstrap.sh',
    'recover': 'recover.sh',
    'debug': 'debug.sh',
    'speed': 'speedwiz.sh'
}

@app.route('/')
def index():
    user_agent = request.headers.get('User-Agent', '').lower()
    
    if 'curl' in user_agent or 'wget' in user_agent:
        help_text = """
CI5 RUNTIME ENVIROMENT v1.0
===========================
  curl ci5.run/install  | sh
  curl ci5.run/recover  | sh
  curl ci5.run/speed    | sh
  curl ci5.run/debug    | sh
"""
        return Response(help_text, mimetype='text/plain')

    return render_template('index.html')

@app.route('/<script_name>')
def serve_script(script_name):
    if script_name in SCRIPT_MAP:
        filename = SCRIPT_MAP[script_name]
        try:
            return send_from_directory(SCRIPT_DIR, filename, mimetype='text/plain')
        except FileNotFoundError:
            return Response("# Error: Script missing.", status=404, mimetype='text/plain')
            
    return Response("# Error: Unknown command.", status=404, mimetype='text/plain')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
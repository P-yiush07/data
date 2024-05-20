from flask import Flask, request, make_response, jsonify
import pandas as pd
import os
from flask_cors import CORS
from file_operations import read_tail, describe, plot_histogram, trainModel, fill_na_with_mean
import threading
import numpy as np
import json
import uuid  # Add this import statement

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Global variable to store the latest file path
latest_file_path = None


# Lock to ensure that only one thread is plotting at a time
plot_lock = threading.Lock()


@app.route('/upload', methods=['POST'])
def upload_file():
    global latest_file_path

    if 'file' not in request.files:
        return make_response({'error': 'No file part'}, 400)  # Use status code

    file = request.files['file']
    if file.filename == '':
        return make_response({'error': 'No selected file'}, 400)  # Use status code

    if file:
        filename = file.filename
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        try:
            file.save(file_path)

            # Read uploaded file into DataFrame (handle potential errors)
            try:
                df = pd.read_csv(file_path)


                head_data = df.head().to_dict(orient='records')  # Alternative for head data

                   # Convert list of records to list of objects
                head_data_objects = [dict(record) for record in head_data]

                # Update the global variable
                latest_file_path = file_path

            except pd.errors.ParserError:
                return make_response({'error': 'Invalid file format'}, 400)

            # Create response object with data
            response_data = {
                'message': 'File uploaded successfully',
                'filename': filename,
                'head': head_data_objects
            }

            # Use jsonify to convert response_data to JSON
            return make_response(jsonify(response_data), 200)

        except Exception as e:
            print(f"Error uploading file: {e}")
            return make_response({'error': 'Internal server error'}, 500)

    return make_response({'error': 'Unexpected error'}, 500)

@app.route('/describe', methods=['GET'])
def describe_route():
    global latest_file_path
   
    latest_df = pd.read_csv(latest_file_path)

    if latest_file_path is None:
        return make_response(jsonify({'error': 'No file uploaded yet'}), 400)
    
    describe_data = describe(latest_df, latest_file_path)

    if describe_data:

        if describe_data:
            # Convert each component to JSON serializable format
            summary_stats_json = {key: str(value) for key, value in describe_data['summary_statistics'].items()}
            data_types_json = {str(key): str(value) for key, value in describe_data['data_types'].items()}
            missing_values_json = {str(key): value for key, value in describe_data['missing_values'].items()}
            unique_values_json = {str(key): value for key, value in describe_data['unique_values'].items()}
            memory_usage_json = {str(key): value for key, value in describe_data['memory_usage'].items()}
            shape_json = describe_data['shape']

        response_data = {
            'message': 'File data retrieved successfully',
            'data': {
                'summary_statistics': summary_stats_json,
                'data_types': data_types_json,
                'missing_values': missing_values_json,
                'unique_values': unique_values_json,
                'memory_usage': memory_usage_json,
                'shape': shape_json
            }
        }

        return make_response((response_data), 200)

    else:
        return make_response(jsonify({'error': 'Error retrieving tail data'}), 500)
    

@app.route('/tail', methods=['GET'])
def tail_route():
    global latest_file_path

    if latest_file_path is None:
        return make_response(jsonify({'error': 'No file uploaded yet'}), 400)

    tail_data = read_tail(latest_file_path)

    if tail_data:
        response_data = {
            'message': 'Tail data retrieved successfully',
            'tail': tail_data
        }
        return make_response(jsonify(response_data), 200)
    else:
        return make_response(jsonify({'error': 'Error retrieving tail data'}), 500)
    
@app.route('/plot', methods=['POST'])
def plot_route():
    global latest_file_path

    if latest_file_path is None:
        return make_response(jsonify({'error': 'No file uploaded yet'}), 400)

    data = request.json
    column1 = data.get('column1')
    column2 = data.get('column2')

    if not column1 or not column2:
        return make_response(jsonify({'error': 'Column names not provided'}), 400)
    
    try:
        plot_histogram(latest_file_path, column1, column2)
        return make_response(jsonify({'message': 'Histogram plotted successfully'}), 200)
    except Exception as e:
        return make_response(jsonify({'error': f'Error plotting histogram: {str(e)}'}), 500)


@app.route('/train', methods=['POST'])
def train_route():
    global latest_file_path

    if latest_file_path is None:
        return make_response(jsonify({'error': 'No file uploaded yet'}), 400)

    # Extract selected columns from the request
    selected_columns = request.json.get('selected_columns')

    if not selected_columns:
        return make_response(jsonify({'error': 'No columns selected'}), 400)

    # Train the model using the selected columns
    mse = trainModel(latest_file_path, selected_columns)

    if mse is not None:
        # Return the MSE as part of the response
        return make_response(jsonify({'mse': mse, 'message': 'Model trained successfully'}), 200)
    else:
        return make_response(jsonify({'error': 'Error training model'}), 500)
    

@app.route('/fillna', methods=['POST'])
def fillna_route():
    global latest_file_path

    if latest_file_path is None:
        return make_response(jsonify({'error': 'No file uploaded yet'}), 400)
    
    # Extract selected columns from the request
    selected_columns = request.json.get('selected_columns')

    if not selected_columns:
        return make_response(jsonify({'error': 'No columns selected'}), 400)
    
    df = pd.read_csv(latest_file_path)
    
    mean_values, null_values_sum, updated_df = fill_na_with_mean(df, latest_file_path, selected_columns)

    # Generate a unique filename for the updated file
    unique_filename = str(uuid.uuid4()) + '.csv'
    updated_file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)

    # Update the global variable `latest_file_path` to point to the updated DataFrame
    latest_file_path = updated_file_path

    # Save the updated DataFrame to the new file path
    updated_df.to_csv(updated_file_path, index=False)

    # Convert int64 types to native int types
    updated_df = updated_df.applymap(lambda x: int(x) if isinstance(x, np.int64) else x)

    

    # Check if the function returned valid results
    if mean_values is not None and null_values_sum is not None and updated_df is not None:
        # Convert DataFrame to JSON-compatible dictionary
        updated_dict = updated_df.to_dict(orient='records')



        # Convert mean_values and null_values_sum to native Python types
        mean_values = {key: float(value) for key, value in mean_values.items()}
        null_values_sum = {key: int(value) for key, value in null_values_sum.items()}

        # Construct response object
        response_data = {
            'message': 'File data retrieved successfully',
            'data': {
                'mean_values': mean_values,
                'null_values_sum': null_values_sum,
                'updated_df': updated_dict
            }
        }

        # If successful, return the response
        return json.dumps(response_data), 200

    else:
        # If there was an error, return an error response
        return make_response(jsonify({'error': 'Failed to fill NA values'}), 500)

if __name__ == '__main__':
    app.run(debug=True)
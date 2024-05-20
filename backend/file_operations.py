import pandas as pd
import plotly.express as px
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error

def read_tail(file_path):
    try:
        df = pd.read_csv(file_path)
        tail_data = df.tail().to_dict(orient='records')

        # Convert list of records to list of objects
        tail_data_objects = [dict(record) for record in tail_data]

        return tail_data_objects
    except Exception as e:
        print(f"Error reading tail of file: {e}")
        return None
    

def describe(df, file_path):
    try:
        # Read the CSV file into a DataFrame
        df = pd.read_csv(file_path)

        # Summary statistics
        summary_stats = df.describe()

        # Data types
        data_types = df.dtypes

        # Count of missing values
        missing_values = df.isnull().sum()

        # Unique value counts for each column
        unique_values = df.nunique()

        # Memory usage
        memory_usage = df.memory_usage(deep=True)

        # Shape of the DataFrame
        shape = df.shape

        # Construct the description dictionary
        description = {
            'summary_statistics': summary_stats.to_dict(),
            'data_types': data_types.to_dict(),
            'missing_values': missing_values.to_dict(),
            'unique_values': unique_values.to_dict(),
            'memory_usage': memory_usage.to_dict(),
            'shape': shape
        }

        return description
    
    except Exception as e:
        print(f"Error describing file: {e}")
        return None
    
def plot_histogram(file_path, column1, column2):
    try:
        df = pd.read_csv(file_path)
        if column1 not in df.columns or column2 not in df.columns:
            print("One or both of the specified columns not found in the CSV file.")
            return

        # Use Plotly Express to create histogram
        fig = px.histogram(df, x=column1, color_discrete_sequence=['blue'], marginal='box',
                           title=f'Histogram of {column1}')

        # Add histogram for column2 as an additional trace
        fig.add_trace(px.histogram(df, x=column2, color_discrete_sequence=['orange']).data[0])

        # Update layout
        fig.update_layout(title_text=f'Histograms of {column1} and {column2}',
                          xaxis_title_text='Values',
                          yaxis_title_text='Frequency')

        # Show plot
        fig.show()

         # Print success message
        # print("Success: Histograms plotted.")

    except Exception as e:
        print(f"Error plotting histograms: {e}")
        return None

def trainModel(file_path, selected_columns):
    try:
        # Read the CSV file into a DataFrame
        df = pd.read_csv(file_path)

        # Extract feature columns (first three selections) and target variable column (last selection)
        feature_columns = selected_columns[:-1]
        target_column = selected_columns[-1]

        # Extract selected features and target variable
        X = df[feature_columns]  # Features
        y = df[target_column]    # Target variable

        # Split the data into training and testing sets
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Initialize and train the linear regression model
        model = LinearRegression()
        model.fit(X_train, y_train)

        # Evaluate the model on the testing set
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)

        # Return the trained model
        return mse

    except Exception as e:
        print(f"Error training model: {e}")
        return None
    

def fill_na_with_mean(df, file_path, columns):
   try:
    # Load the CSV file into a DataFrame
    df = pd.read_csv(file_path)

    # Create dictionaries to store the mean value and sum of null values for each column
    mean_values = {}
    null_values_sum = {}

    # Iterate over the specified columns
    for column in columns:
        # Calculate the mean of the column
        mean_value = df[column].mean()
        mean_values[column] = mean_value

        # Fill NA values in the column with the mean
        df[column].fillna(mean_value, inplace=True)

        # Calculate the sum of null values for the column
        null_values_sum[column] = df[column].isnull().sum()

    # Return the dictionaries containing the mean value and sum of null values for each column
    return mean_values, null_values_sum, df

   except Exception as e:
        print(f"Error filling values: {e}")
        return None
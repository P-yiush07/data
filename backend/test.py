from file_operations import drop_column
import pandas as pd

# Sample CSV file path
file_path = "uploads/titanic.csv"

# Columns to drop
columns_to_drop = ['Sex']

# Call the drop_column function with the file path and columns to drop
modified_df = drop_column(file_path, columns_to_drop)

if modified_df is not None:
    print("Columns dropped successfully:")
    print(modified_df)
else:
    print("Error dropping columns.")




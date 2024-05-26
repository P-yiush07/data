from file_operations import process_dataframe
import pandas as pd

# Sample CSV file path
file_path = "uploads/titanic.csv"

df = pd.read_csv(file_path)

result = process_dataframe(df, ".isnull().sum()")

print(result)


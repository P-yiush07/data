from file_operations import fill_na_with_mean
import pandas as pd

# Sample CSV file path
file_path = "uploads/titanic.csv"

df = pd.read_csv(file_path)

columns_to_fill = ['Age']
mean_values, null_values_sum, updated_df = fill_na_with_mean(df, file_path, columns_to_fill)

print("\nMean values used for filling NA:")
print(mean_values)

print("\nNull values after filling with mean:")
print(null_values_sum)

print("\nUpdated DataFrame:")
print(updated_df)
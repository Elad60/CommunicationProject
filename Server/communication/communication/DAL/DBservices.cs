using Microsoft.Data.SqlClient;


/// <summary>
/// DBServices is a class created by me to provides some DataBase Services
/// </summary>
public class DBservices
{

    public DBservices(){}

    //--------------------------------------------------------------------------------------------------
    // This method creates a connection to the database according to the connectionString name in the web.config 
    //--------------------------------------------------------------------------------------------------
    private static SqlConnection connect()
    {
        // read the connection string from the configuration file
        IConfigurationRoot configuration = new ConfigurationBuilder()
        .AddJsonFile("appsettings.json").Build();
        string cStr = configuration.GetConnectionString("myProjDB");
        SqlConnection con = new SqlConnection(cStr);
        con.Open();
        return con;
    }

    public static Object ExecuteSqlProcedure(SqlCommand cmd, Func<SqlCommand,Object> func)
    {
        try
        {
            return func(cmd);
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        finally
        {
            // close the db connection
            cmd.Connection?.Close();
        }
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand using a stored procedure
    //---------------------------------------------------------------------------------
    public static SqlCommand CreateStoredProdecureCommand(string procedureName, params string[] parameters)
    {

        SqlCommand cmd = new SqlCommand(); // create the command object

        if (parameters.Length % 2 != 0 && parameters.Length != 1) throw new Exception("need to write key value pairs for the command!");
        cmd.Connection = connect();              // assign the connection to the command object
        cmd.CommandTimeout = 10;           // Time to wait for the execution' The default is 30 seconds
        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command, can also be text
        cmd.CommandText = procedureName;      // can be Select, Insert, Update, Delete 
        string key = "@";
        foreach (string param in parameters)
        {
            if (param.StartsWith("@"))
            {
                key = param;
            }
            else if (param != "")
            {
                cmd.Parameters.AddWithValue(key, param);
            }
        }

        return cmd;
    }

    public static SqlCommand CreateStoredProdecureCommand(string procedureName) => CreateStoredProdecureCommand(procedureName,"");

}

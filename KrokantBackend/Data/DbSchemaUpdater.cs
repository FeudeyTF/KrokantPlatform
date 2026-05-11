using System.Data;
using Microsoft.EntityFrameworkCore;

namespace KrokantBackend.Data
{
    public static class DbSchemaUpdater
    {
        public static void EnsureCompatibleSchema(KrokantContext db)
        {
            EnsurePriorityColumn(db);

            db.Database.ExecuteSqlRaw(
                """
                CREATE TABLE IF NOT EXISTS TaskComments (
                    Id TEXT NOT NULL CONSTRAINT PK_TaskComments PRIMARY KEY,
                    TaskId TEXT NOT NULL,
                    AuthorId TEXT NOT NULL,
                    AuthorName TEXT NOT NULL,
                    Text TEXT NOT NULL,
                    CreatedAt TEXT NOT NULL,
                    CONSTRAINT FK_TaskComments_Tasks_TaskId FOREIGN KEY (TaskId) REFERENCES Tasks (Id) ON DELETE CASCADE
                );
                """);

            db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_TaskComments_TaskId ON TaskComments (TaskId);");

            db.Database.ExecuteSqlRaw(
                """
                CREATE TABLE IF NOT EXISTS TaskActivities (
                    Id TEXT NOT NULL CONSTRAINT PK_TaskActivities PRIMARY KEY,
                    TaskId TEXT NOT NULL,
                    ActorName TEXT NOT NULL,
                    Action TEXT NOT NULL,
                    CreatedAt TEXT NOT NULL,
                    CONSTRAINT FK_TaskActivities_Tasks_TaskId FOREIGN KEY (TaskId) REFERENCES Tasks (Id) ON DELETE CASCADE
                );
                """);

            db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_TaskActivities_TaskId ON TaskActivities (TaskId);");
        }

        private static void EnsurePriorityColumn(KrokantContext db)
        {
            if (ColumnExists(db, "Tasks", "Priority"))
                return;

            db.Database.ExecuteSqlRaw("ALTER TABLE Tasks ADD COLUMN Priority INTEGER NOT NULL DEFAULT 2;");
        }

        private static bool ColumnExists(KrokantContext db, string table, string column)
        {
            var connection = db.Database.GetDbConnection();
            var shouldClose = connection.State != ConnectionState.Open;

            if (shouldClose)
                connection.Open();

            try
            {
                using var command = connection.CreateCommand();
                command.CommandText = $"PRAGMA table_info('{table}')";

                using var reader = command.ExecuteReader();
                while (reader.Read())
                {
                    var name = reader["name"]?.ToString();
                    if (string.Equals(name, column, StringComparison.OrdinalIgnoreCase))
                        return true;
                }

                return false;
            }
            finally
            {
                if (shouldClose)
                    connection.Close();
            }
        }
    }
}

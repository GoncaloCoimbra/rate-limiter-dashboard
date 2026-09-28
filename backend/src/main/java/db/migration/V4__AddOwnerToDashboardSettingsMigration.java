package db.migration;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

public class V4__AddOwnerToDashboardSettingsMigration extends BaseJavaMigration {

    @Override
    public void migrate(Context context) throws Exception {
        Connection connection = context.getConnection();

        if (!hasColumn(connection, "dashboard_settings", "owner_username")) {
            execute(connection, "ALTER TABLE dashboard_settings ADD COLUMN owner_username VARCHAR(160) NULL");
        }

        execute(connection, "UPDATE dashboard_settings SET owner_username = 'admin' WHERE owner_username IS NULL");

        if (isMysql(connection)) {
            if (hasIndex(connection, "dashboard_settings", "SETTING_KEY")) {
                execute(connection, "ALTER TABLE dashboard_settings DROP INDEX SETTING_KEY");
            }
        } else {
            if (hasIndex(connection, "dashboard_settings", "SETTING_KEY")) {
                execute(connection, "ALTER TABLE dashboard_settings DROP CONSTRAINT SETTING_KEY");
            }
        }

        if (!hasIndex(connection, "dashboard_settings", "uk_dashboard_settings_owner_key")) {
            execute(connection, "ALTER TABLE dashboard_settings ADD CONSTRAINT uk_dashboard_settings_owner_key UNIQUE (owner_username, setting_key)");
        }
    }

    private void execute(Connection connection, String sql) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    private boolean hasColumn(Connection connection, String tableName, String columnName) throws SQLException {
        DatabaseMetaData metadata = connection.getMetaData();
        try (ResultSet resultSet = metadata.getColumns(null, null, tableName, columnName)) {
            return resultSet.next();
        }
    }

    private boolean hasIndex(Connection connection, String tableName, String indexName) throws SQLException {
        DatabaseMetaData metadata = connection.getMetaData();
        try (ResultSet resultSet = metadata.getIndexInfo(null, null, tableName, false, false)) {
            while (resultSet.next()) {
                String name = resultSet.getString("INDEX_NAME");
                if (indexName.equalsIgnoreCase(name)) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean isMysql(Connection connection) throws SQLException {
        String databaseProductName = connection.getMetaData().getDatabaseProductName();
        return databaseProductName != null && databaseProductName.toLowerCase().contains("mysql");
    }
}

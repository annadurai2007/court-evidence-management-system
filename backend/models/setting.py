"""
Settings model & serialization helper
"""

class SettingModel:
    @staticmethod
    def rows_to_dict(rows):
        """Converts key-value DB rows into a single structured settings object."""
        settings = {
            "theme": "dark",
            "compactMode": False,
            "emailNotifications": True,
            "custodyAlerts": True,
            "autoHashVerification": True,
            "defaultCourt": "Metropolitan Financial Crimes Court",
            "hashAlgorithm": "SHA-256"
        }
        if not rows:
            return settings

        for r in rows:
            key = r.get("setting_key")
            val = r.get("setting_value")
            if key in settings:
                if val in ["true", "True", "1"]:
                    settings[key] = True
                elif val in ["false", "False", "0"]:
                    settings[key] = False
                else:
                    settings[key] = val
            else:
                settings[key] = val
        return settings

    @staticmethod
    def dict_to_rows(settings_dict):
        """Converts frontend settings dictionary to key-value rows for DB."""
        rows = []
        for k, v in settings_dict.items():
            str_val = str(v).lower() if isinstance(v, bool) else str(v)
            rows.append((k, str_val))
        return rows

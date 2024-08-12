import re
from datetime import datetime as dt
from .basic_traits import StaticCast

class Format():

    @staticmethod
    def str(s):
        """Format a string by removing extra spaces and replacing quotes with backticks."""
        try:
            return re.sub(r'["\']', '`', re.sub(r'\s+', ' ', str(s).strip())).strip()
        except Exception:
            return ""

    def float(n):
        """Convert a string to a float, handling different formats."""
        n = Format.str(n)
        try:
            if not n:
                return 0.0
            formatted_n = n.replace(".", "").replace(",", ".")
            if "-" in n:
                formatted_n = f"-{formatted_n.replace('-', '')}"
            return float(formatted_n)
        except Exception:
            return 0.0

    def int(n):
        """Convert a string to an int, handling different formats."""
        n = Format.str(n)
        try:
            if not n:
                return 0
            formatted_n = n.replace(".", "").replace(",", ".")
            if "-" in n:
                formatted_n = f"-{formatted_n.replace('-', '')}"
            return int(formatted_n)
        except Exception:
            return 0

    def date(s, fmt=StaticCast.SHORT_DATE):
        """Convert a string to a datetime object if the year is greater than 1900."""
        try:
            d = dt.strptime(str(s).strip(), fmt)
            return d if d.year > 1900 else ''
        except Exception:
            return ''

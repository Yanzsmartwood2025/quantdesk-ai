import unittest

class TestImports(unittest.TestCase):
    def test_imports(self):
        try:
            from src.config import settings
            from src.services.oanda_client import oanda
            from src.services.supabase_client import db_client
            from src.agents.analyst import TechAnalystAgent
            from src.agents.risk import RiskManagerAgent
            from src.agents.portfolio import PortfolioManagerAgent
            import src.main
        except Exception as e:
            self.fail(f"Import failed: {e}")

if __name__ == '__main__':
    unittest.main()

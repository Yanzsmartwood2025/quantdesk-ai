import re

with open("web/src/components/dashboard/Dashboard.tsx", "r") as f:
    content = f.read()

# Make sure the realtime subscription useEffect dependencies are correct
search_str = """          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error("Error setting up realtime subscriptions:", err);
    }
  }, [instrument, selectedTimeframe]);"""

if search_str in content:
    print("Realtime subscription dependencies are correct: [instrument, selectedTimeframe]")
else:
    print("Could not find dependencies string.")

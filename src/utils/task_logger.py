import asyncio
import traceback

def log_task_exception(task: asyncio.Task) -> None:
    """
    Callback to be attached to background tasks to log any unhandled exceptions.
    Use: task.add_done_callback(log_task_exception)
    """
    try:
        if not task.cancelled():
            exception = task.exception()
            if exception:
                print(f"\n[BACKGROUND TASK ERROR] Task '{task.get_name()}' failed with exception: {repr(exception)}")
                traceback.print_exception(type(exception), exception, exception.__traceback__)
    except Exception as e:
        print(f"[SYSTEM ERROR] Failed to log task exception: {e}")

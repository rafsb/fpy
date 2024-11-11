def gauge(p, prefix='', suffix='', length=32, fill='█'):
    """Display a progress bar in the console.
    Args:
        p (float): Progress value between 0 and 1.
        prefix (str): String to display before the progress bar.
        suffix (str): String to display after the progress bar.
        length (int): Total length of the progress bar.
        fill (str): Character to use for the filled part of the progress bar.
    """
    p = min(1, max(0, p))  # Ensure p is between 0 and 1
    filled_length = int(length * p)

    bar = fill * filled_length + '-' * (length - filled_length)
    percentage = int(p * 100)
    msg = f'\r{prefix} |{bar}| {percentage:>3}% {suffix}'
    print(msg, end='\r')
    if p == 1:
        print()

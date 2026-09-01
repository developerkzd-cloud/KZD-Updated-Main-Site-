// Ensure dropdowns work at all positions on the page

document.addEventListener('DOMContentLoaded', function () {
    // Select all dropdown toggles
    const dropdownToggles = document.querySelectorAll('[data-toggle="dropdown"]');

    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent default link behavior if it's an anchor

            // Find the associated dropdown menu
            const dropdownMenu = this.nextElementSibling;

            if (dropdownMenu && dropdownMenu.classList.contains('dropdown-menu')) {
                // Toggle the 'show' class to open/close the dropdown
                dropdownMenu.classList.toggle('show');

                // Close other dropdowns if open
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    if (menu !== dropdownMenu) {
                        menu.classList.remove('show');
                    }
                });
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
});
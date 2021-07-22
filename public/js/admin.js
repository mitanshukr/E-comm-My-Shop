const deleteProduct = (btn) => {
    const productId = btn.parentNode.querySelector('[name=productId]').value;
    const csrfToken = btn.parentNode.querySelector('[name=_csrf]').value;

    const productElement = btn.closest('article');      //closest article tag which is to be deleted!

    fetch('/admin/delete-item/' + productId, {
        method: "DELETE",
        headers: {
            "csrf-token": csrfToken,
        }
    })
    .then(result => result.json())
    .then(data => {
        console.log(data);
        // productElement.remove();     //not supported in old browsers!
        productElement.parentNode.removeChild(productElement);
    }).catch(err => {
        console.log(err);
    })
};
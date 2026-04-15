async function main() {
  const res = await fetch("http://120.78.3.29/api/dev/museen-dashboard/admin/customer/GetList", {
    method: "POST",
  })
  console.log(await res.json())
}
main()
